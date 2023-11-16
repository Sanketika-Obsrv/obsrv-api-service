from model.data_models import Action, CommandPayload

class ICommand:

    def execute(self, command_payload: CommandPayload, action: Action):
        pass

