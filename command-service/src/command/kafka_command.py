from command.icommand import ICommand
from command.icommand import ICommand
from config import Config
from model.data_models import Action, ActionResponse, CommandPayload
from service.http_service import HttpService
from confluent_kafka.admin import AdminClient, NewTopic, KafkaError, KafkaException
from command.dataset_command import DatasetCommand

class KafkaCommand(ICommand):
    def __init__(self, config: Config, http_service: HttpService, dataset_command: DatasetCommand):
        self.config = config
        self.http_service = http_service
        self.dataset_command = dataset_command
        
    def execute(self, command_payload: CommandPayload, action: Action):
        result = None
        dataset_id = command_payload.dataset_id
        live_dataset, data_version = self.dataset_command._check_for_live_record(dataset_id)
        if live_dataset is None:
            if action == Action.CREATE_KAFKA_TOPIC.name:
                print(
                    f"Invoking CREATE_KAFKA_TOPIC command for dataset_id {dataset_id}..."
                )
                draft_dataset_record = self.dataset_command._get_draft_dataset(dataset_id)
                topic = draft_dataset_record.get("router_config")["topic"]
                broker = self.config.find("kafka.brokers")
                num_partitions = self.config.find("kafka.no_of_partitions")
                replication_factor = self.config.find("kafka.replication_factor")
                print(f"topic is", topic)
                result = self.create_kafka_topic(topic, broker, num_partitions, replication_factor)
            return result
        return ActionResponse(status="OK", status_code=200)  


    def create_kafka_topic(self, topic, broker, num_partitions, replication_factor):
        errValue = ActionResponse(status="ERROR", status_code=500)  

        try:
            admin_client = AdminClient({'bootstrap.servers': broker})
            new_topic = [NewTopic(topic, num_partitions=num_partitions, replication_factor=replication_factor)]
            fs = admin_client.create_topics(new_topic)
            for topic, f in fs.items():
                f.result()
                print(f"Topic '{topic}' created successfully")
                return ActionResponse(status="OK", status_code=200)    
        except (KafkaError, KafkaException) as kafkaErr:
            print(f"Kafka exception:", kafkaErr)
            return errValue
        except RuntimeError as e:
            print(f"Runtime exception: {e}")
            return errValue
        except Exception as e:
            print(f"Error creating topic: {e}")
            return errValue 