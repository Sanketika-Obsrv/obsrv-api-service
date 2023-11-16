# command-service
## Implementation

### Commands
* Each command implementation under the command module will extend from icommand interface and will have to implement the execute function. 
* The execute function will take a command payload json object and also an action as input.
* Currently implemented FlinkCommand class.

### Services
Currently, there are one generic service under the services module:

* HttpService implements GET, POST and DELETE operations. The service uses urllib3 library to invoke http urls.

### Configuration

* The config.py class has an utility implementation `find` to read nested configurations from a yaml file. 
* The service_config.yml class has all the required configurations for the service.
    - The flink.jobs configuration is required to specify the list of jobs and the corresponding job_manager_urls. This is required for restarting the required jobs.
    - The commands entry will have the workflow of sub-commands for each higher level comamnd. For e.g., RESTART_PIPELINE command is comprised for RESTART_PIPELINE_JOBS sub-command.

### Deployment

```
helm install command-api ./helm-charts/command-service -n command-service
```
