import json
import os
import base64
import tarfile
import uuid
import zipfile
from datetime import datetime
from pathlib import Path

import requests
import subprocess
from fastapi import status

from config import Config
from service.http_service import HttpService
from service.db_service import DatabaseService
from model.db_models import ConnectorRegsitryv2


class RegistryResponse:
    def __init__(self, status: str, message: str, statusCode: status, connector_info = None):
        self.status = status
        self.connector_info = connector_info
        self.message = message  # Ensure message is directly a string
        self.statusCode = statusCode


class ConnectorRegistry:
    def __init__(self):
        self.metadata = dict()
        self.db_service = DatabaseService()
        self.config = Config()
        self.download_path = self.config.find("connector_registry.download_path")
        self.uuid = str(uuid.uuid4())
        self.extraction_path = os.path.join(self.download_path, self.uuid)
        self.metadata = None
        self.ui_spec = None
        self.metadata_file_name = self.config.find(
            "connector_registry.metadata_file_name"
        )
        self.ui_spec_file_name = self.config.find("connector_registry.ui_spec_file")
        self.dataset_api_url = self.config.find("dataset_api.host").strip("/")
        self.pre_signed_url = self.config.find("dataset_api.pre_signed_url").strip("/")

    def register(self, rel_path: str) -> RegistryResponse:
        try:
            download_file_path = os.path.join(self.download_path, rel_path)
            file_extension = rel_path.split(".")[-1]

            # if not os.path.exists(download_file_path):
            http_service = HttpService()
            print(
                f"Connector Registry | Received request to register connector: {rel_path} | {self.dataset_api_url}/{self.pre_signed_url}"
            )
            dataset_api_request = {"request": {"files": [rel_path], "access": "read", "type": "connector"}}
            dataset_api_response = http_service.post(
                url=f"{self.dataset_api_url}/{self.pre_signed_url}",
                    body=json.dumps(dataset_api_request),
                    headers={"Content-Type": "application/json"}
                )
            print(
                f"Connector Registry | Dataset API Response: {dataset_api_response.body}"
            )

            if dataset_api_response.status != 200:
                return RegistryResponse(
                    status="failure",
                    message="dataset api failed to generate read url.",
                    statusCode=status.HTTP_400_BAD_REQUEST,
                )

            dataset_api_response_data = json.loads(dataset_api_response.body)
            url = dataset_api_response_data.get("result", [{}])[0].get(
                "preSignedUrl", None
            )
            if not url:
                return RegistryResponse(
                    status="failure",
                    message="dataset api failed to generate read url.",
                    statusCode=status.HTTP_400_BAD_REQUEST,
                )

            self.cleanup_download_path()
            os.makedirs(self.download_path, exist_ok=True)

            # download the file
            download_status = self.download_file(url, download_file_path)
            print(f"Connector Registry | Download status: {download_status}")
            if not download_status:
                return RegistryResponse(
                    status="failure",
                    message="failed to download the file",
                    statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # extract the file
            os.makedirs(self.extraction_path, exist_ok=True)
            extraction_status = ExtractionUtil.extract(
                file=download_file_path,
                extract_out_path=self.extraction_path,
                ext=file_extension,
            )
            if extraction_status.status.lower() == "failure":
                return extraction_status

            load_metadata_status = self.load_metadata(self.extraction_path)

            # Loading of metadata
            if not load_metadata_status:
                return RegistryResponse(
                    status="failure",
                    message="unable to locate the metadata file",
                    statusCode=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            # check if folder exists
            connector_source = f"{self.metadata['metadata']['id']}-{self.metadata['metadata']['version']}"
            if not os.path.exists(os.path.join(self.extraction_path, connector_source)):
                return RegistryResponse(
                    status="failure",
                    message=f"connector source folder not found; expecting {connector_source} folder inside the archive",
                    statusCode=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            load_ui_config_status = self.load_ui_metadata(self.extraction_path)

            # Loading of ui configurations
            if not load_ui_config_status:
                return RegistryResponse(
                    status="failure",
                    message="Unable to locate the ui configuration File",
                    statusCode=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            # Process of the metadata
            return self.process_metadata(rel_path, connector_source)

        except Exception as e:
            print(f"Connector Registry | An error occurred: {e}")
            return RegistryResponse(
                status="failure",
                message="Failed to register connector",
                statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # Method to clean up the local directory
    def cleanup_download_path(self):
        if os.path.exists(self.download_path):
            os.system(f"rm -rf {self.download_path}/*")

    # Method to load the file data into object (ex: ui config file and metadata file)
    def load_json_file(self, extract_out_path, file_name, attribute_name):
        for root, dirs, files in os.walk(extract_out_path):
            for name in files:
                if name == file_name:
                    print(f"Connector Registry | {file_name} found")
                    with open(os.path.join(root, name)) as f:
                        data = json.load(f)
                        if not data:
                            print(f"Connector Registry | Empty {file_name} file")
                            return False
                        setattr(self, attribute_name, data)
                        return True
        print(f"Connector Registry | {file_name} not found")
        return False

    def load_metadata(self, extract_out_path):
        return self.load_json_file(
            extract_out_path, self.metadata_file_name, "metadata"
        )

    def load_ui_metadata(self, extract_out_path):
        return self.load_json_file(extract_out_path, self.ui_spec_file_name, "ui_spec")

    # Method to save the metadata and ui_spec configuration into db
    def process_metadata(self, rel_path, connector_source) -> RegistryResponse:
        result = []
        tenant = self.metadata.get("metadata", {}).get("tenant", "")
        
        self.copy_connector_to_runtime(self.metadata['metadata']['runtime'], connector_source)
        
        if tenant == "multiple":
            connector_objects = self.metadata["connectors"]
            for obj in connector_objects:
                source = {
                    "source": connector_source,
                    "main_class": obj["main_class"] if "main_class" in obj else self.metadata["metadata"]["main_class"],
                    "main_program": obj["main_program"] if "main_program" in obj else self.metadata["metadata"]["main_program"],
                }

                connector_id = obj["id"].replace(" ", "-")
                self.update_connector_registry(connector_id, self.metadata['metadata']['version'])
                registry_meta = ConnectorRegsitryv2(connector_id,
                        obj['name'],
                        'source',
                        self.metadata['metadata']['category'],
                        self.metadata['metadata']['version'],
                        obj['description'],
                        self.metadata['metadata']['technology'],
                        self.metadata['metadata']['runtime'],
                        self.metadata['metadata']['licence'],
                        self.metadata['metadata']['owner'],
                        self.load_file_bytes(obj["icon"]),
                        'Live',
                        rel_path,
                        json.dumps(source),
                        'SYSTEM',
                        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        self.ui_spec[obj["id"]] if obj["id"] in self.ui_spec else {},
                        'SYSTEM',
                        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    )
                query, params = self.build_insert_query(registry_meta)
                success = self.execute_query(query, params)
                
                subprocess.run(["rm", "-rf", self.extraction_path])
                subprocess.run(["rm", "-rf", self.download_path])
                         
                if not success:
                    return RegistryResponse(
                        status="failure",
                        message=f"Failed to register connector {connector_id}",
                        statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                result.append(registry_meta.to_dict())    
            return RegistryResponse(
                status="success",
                connector_info=result,
                message="Connectors registered successfully",
                statusCode=status.HTTP_200_OK
            )

        else:
            connector_id = (
                self.metadata.get("metadata", {}).get("id", "").replace(" ", "-")
            )
            self.update_connector_registry(connector_id, self.metadata['metadata']['version'])
            source = {
                "source": connector_source,
                "main_class": self.metadata["metadata"]["main_class"],
                "main_program": self.metadata["metadata"]["main_program"],
            }

            registry_meta = ConnectorRegsitryv2(
                connector_id,
                self.metadata['metadata']['name'],
                'source',
                self.metadata['metadata']['category'],
                self.metadata['metadata']['version'],
                self.metadata['metadata']['description'],
                self.metadata['metadata']['technology'],
                self.metadata['metadata']['runtime'],
                self.metadata['metadata']['licence'],
                self.metadata['metadata']['owner'],
                self.load_file_bytes(self.metadata['metadata']["icon"]),
                'Live',
                rel_path,
                json.dumps(source),
                'SYSTEM',
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                self.ui_spec,
                'SYSTEM',
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            query, params = self.build_insert_query(registry_meta)
            success = self.execute_query(query, params)
            
            subprocess.run(["rm", "-rf", self.extraction_path])
            subprocess.run(["rm", "-rf", self.download_path])
            
            if not success:
                return RegistryResponse(
                    status="failure",
                    message=f"Failed to register connector {connector_id}",
                    statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return RegistryResponse(
                status="success",
                message="Connectors registered successfully",
                connector_info=[registry_meta.to_dict()],
                statusCode=status.HTTP_200_OK,
            )


    def execute_query(self, query, params) -> bool:
        try:
            result = self.db_service.execute_upsert(sql=query, params=params)
            print(f"Connector Registry | {result} rows affected")
            return result > 0  # Assuming the result is the number of affected rows
        except Exception as e:
            print(
                f"Connector Registry | An error occurred during the execution of Query: {e}"
            )
            return False

    # Method to download the file from blob store
    def download_file(self, url, destination) -> bool:
        try:
            print(f"destination {destination}")
            response = requests.get(url, stream=True)
            response.raise_for_status()

            with open(destination, "wb") as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)

            print(
                f"Connector Registry | Download completed successfully. URL:{url} Destination: {destination}"
            )
            return True
        except requests.exceptions.HTTPError as http_err:
            print(
                f"Connector Registry | HTTP error occurred during the file download:  {http_err}"
            )
            return False
        except Exception as e:
            print(
                f"Connector Registry | An unexpected error occurred during the file download:  {e}"
            )
            return False

    def build_insert_query(self, registry_meta: ConnectorRegsitryv2):
        ui_spec_json = json.dumps(registry_meta.ui_spec)
        query =f"""
        INSERT INTO connector_registry (
            id, connector_id, name, type, category, version, description, 
            technology, runtime, licence, owner, iconurl, status, source_url, 
            source, ui_spec, created_by, updated_by, created_date, updated_date, live_date
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, 
            %s, %s, %s, %s, %s, %s, %s, 
            %s, %s, %s, %s, %s, %s, %s
        ) ON CONFLICT (
            connector_id, version
        ) DO UPDATE SET 
            id = %s,
            name = %s,
            type = %s,
            category = %s,
            version = %s,
            description = %s,
            technology = %s,
            runtime = %s,
            licence = %s,
            owner = %s,
            iconurl = %s,
            status = %s,
            source_url = %s,
            source = %s,
            ui_spec = %s::jsonb,
            updated_date = %s
        ;;
        """
        params = (
            registry_meta.id + "-" + registry_meta.version,
            registry_meta.id,
            registry_meta.name,
            registry_meta.type,
            registry_meta.category,
            registry_meta.version,
            registry_meta.description,

            registry_meta.technology,
            registry_meta.runtime,
            registry_meta.licence,
            registry_meta.owner,
            registry_meta.iconurl,
            registry_meta.status,
            registry_meta.source_url,

            registry_meta.source,
            ui_spec_json,
            'SYSTEM',
            'SYSTEM',
            datetime.now(),
            datetime.now(),
            datetime.now(),

            registry_meta.id + "-" + registry_meta.version,
            registry_meta.name,
            registry_meta.type,
            registry_meta.category,
            registry_meta.version,
            registry_meta.description,
            registry_meta.technology,
            registry_meta.runtime,
            registry_meta.licence,
            registry_meta.owner,
            registry_meta.iconurl,
            registry_meta.status,
            registry_meta.source_url,
            registry_meta.source,
            ui_spec_json,
            datetime.now(),
        )
        return query, params
    
    def load_file_bytes(self, rel_path: str) -> bytes | None:
        file_path = Path(self.extraction_path)
        for item in file_path.glob("*/{}".format(rel_path)):
            try:
                with open(item, 'rb') as file:
                    file_content = file.read()
                encoded = base64.b64encode(file_content).decode("ascii")
            except IsADirectoryError:
                print(
                    f"Connector Registry | No value for icon URL given at metadata: {rel_path}"
                )
                return None
            except FileNotFoundError:
                print(
                    f"Connector Registry | No file present at indicated relative path: {rel_path}"
                )
                return None
            except (ValueError or TypeError) as e:
                print(
                    f"Connector Registry | File content not byte like: {e}"
                )
                return None
            return encoded

    def update_connector_registry(self, _id, ver):
        try:
            result = self.db_service.execute_upsert(
                f"UPDATE connector_registry SET status = 'Retired', updated_date = now() WHERE connector_id = %s AND status = 'Live' AND version != %s", (_id, ver)
            )
            print(
                f"Connector Registry | Retired {result} versions for connector_id: {_id} and version: {ver}"
            )
        except Exception as e:
            print(
                f"Connector Registry | An error occurred during the execution of Query: {e}"
            )
    
    def copy_connector_to_runtime(self, runtime: str, connector_source: str):
        if runtime == "spark":
            return self.copy_connector_to_spark(connector_source)
                            

    def copy_connector_to_spark(self, connector_source: str):
        print(f"Connector Registry | copying {connector_source} to spark")
        ## get name of the spark pod using kubectl
        spark_pod_cmd = [
            "kubectl",
            "get",
            "pods",
            "-n",
            "spark",
            "-l",
            "app.kubernetes.io/name=spark,app.kubernetes.io/component=master",
            "-o",
            "jsonpath='{.items[0].metadata.name}'",
        ]

        spark_pod_result = subprocess.run(spark_pod_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        print(f"Connector Registry | spark_pod_result:  {spark_pod_result}")

        if spark_pod_result.returncode != 0:
            return RegistryResponse(
                status="failure",
                message="failed to get the spark pod",
                statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        spark_pod = spark_pod_result.stdout.decode("utf-8").replace("'", "")
        print(f"Connector Registry | spark_pod:  {spark_pod}")

        ## copy the connector to the spark pod under /data/connectors/{source}
        source_path = os.path.join(self.extraction_path, connector_source)
        copy_cmd = [
            "kubectl",
            "cp",
            f"{source_path}",
            f"spark/{spark_pod}:/data/connectors/{connector_source}",
        ]

        copy_result = subprocess.run(copy_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"Connector Registry | copy_result:  {copy_result}")
        if copy_result.returncode != 0:
            return RegistryResponse(
                status="failure",
                message="failed to copy the connector to spark",
                statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        if self.metadata['metadata']['technology'] == "python":
            pip_install_cmd = [
                "kubectl",
                "exec",
                f"pod/{spark_pod}",
                "-n",
                "spark",
                "--",
                "bash",
                "-c",
                f"pip install -r /data/connectors/{connector_source}/requirements.txt",
            ]

            pip_install_result = subprocess.run(pip_install_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print(f"Connector Registry | pip_install_result:  {pip_install_result}")
            if pip_install_result.returncode != 0:
                return RegistryResponse(
                    status="failure",
                    message="failed to install the requirements on spark",
                    statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
                
        return RegistryResponse(
            status="success",
            message="connector copied to spark successfully",
            statusCode=status.HTTP_200_OK,
        )

class ExtractionUtil:
    def extract_gz(tar_path, extract_path):
        with tarfile.open(tar_path, "r:*") as tar:
            tar.extractall(path=extract_path)

    def extract_zip(tar_path, extract_path):
        with zipfile.ZipFile(tar_path, "r") as zip_ref:
            zip_ref.extractall(path=extract_path)

    # Method to extract the compressed files
    def extract(file, extract_out_path, ext) -> RegistryResponse:
        extraction_function = ExtractionUtil.extract_gz

        compression_types = {
            "zip": ExtractionUtil.extract_zip,
        }

        try:
            print(
                f"Connector Registry | Extracting {file} to {extract_out_path} of {ext} file type"
            )

            if ext in compression_types:
                extraction_function = compression_types.get(ext)

            extraction_function(file, extract_out_path)
            print(f"Connector Registry | Extraction complete for {file}")
            return RegistryResponse(
                status="success",
                message="Extraction Successfully Completed",
                statusCode=status.HTTP_200_OK,
            )
        except (tarfile.TarError, zipfile.BadZipFile, OSError) as e:
            print(
                f"Connector Registry | An error occurred while extracting the file: {e}"
            )
            return RegistryResponse(
                status="failure",
                message="Failed to Extract the File",
                statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            print(f"Connector Registry | An unexpected error occurred: {e}")
            return RegistryResponse(
                status="failure",
                message="Failed to Extract the File",
                statusCode=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
