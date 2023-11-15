
class FlinkConnectionException(BaseException):
    def __init__(self, message):
        self.message = message

class FlinkHelmInstallException(BaseException):
    def __init__(self, message):
        self.message = message

class HttpConnectionException(BaseException):
    def __init__(self, message):
        self.message = message