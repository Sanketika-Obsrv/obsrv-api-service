import urllib3
from urllib3.exceptions import NewConnectionError, MaxRetryError
import backoff

from model.data_models import HttpResponse

class HttpService():

    def __init__(self):
        self.http = urllib3.PoolManager(num_pools=5)

    @backoff.on_exception(wait_gen=backoff.expo, 
                          exception=(NewConnectionError, MaxRetryError), 
                          max_tries=3)
    def post(self, url: str, body=None, headers=None):
        response = self.http.request('POST', url, body=body, headers=headers)
        return HttpResponse(status = response.status, body = response.data.decode("utf-8"))
    
    @backoff.on_exception(wait_gen=backoff.expo, 
                          exception=(NewConnectionError, MaxRetryError), 
                          max_tries=3)
    def get(self, url: str):
        response = self.http.request('GET', url)
        return HttpResponse(status = response.status, body = response.data.decode("utf-8"))
    
    def delete(self, url: str):
        response = self.http.request('DELETE', url)
        return HttpResponse(status = response.status, body = response.data.decode("utf-8"))