import yaml
from functools import reduce
import operator

class Config():

    def __init__(self):
        with open('config/service_config.yml') as config_file:
            self.config = yaml.safe_load(config_file)

    def find(self, path):
        element_value = reduce(operator.getitem, path.split("."), self.config)
        return element_value