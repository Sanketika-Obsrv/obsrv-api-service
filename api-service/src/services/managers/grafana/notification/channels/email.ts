import _ from "lodash";
import { IChannelConfig } from "../../../../../types/AlertModels";
import { grafanaHttpClient } from "../../../../../connections/grafanaConnection";

const getReceiverObject = ({ name, recipientAddresses, message, multipleAddresses, type }: any) => {
    return {
        name,
        grafana_managed_receiver_configs: [
            {
                settings: {
                    addresses: recipientAddresses,
                    subject: "{{template \"email\" .}}",
                    singleEmail: !multipleAddresses,
                    ...(message && {
                        message
                    })
                },
                secureSettings: {},
                type: type,
                name,
                disableResolveMessage: true
            }
        ]
    }
}

const service: IChannelConfig = {
    name: "email",
    service: {
        generateConfigPayload(payload: Record<string, any>): Record<string, any> {
            const { type, config, name } = payload;
            const { recipientAddresses, message, subject = "Obsrv Alert", labels = [[`notificationChannel_${name}_${type.toLowerCase()}`, "=", "true"]] } = config;
            const multipleAddresses = _.size(_.split(recipientAddresses, ";")) > 1;
            return {
                notificationPolicy: {
                    receiver: name,
                    object_matchers: labels
                },
                receiver: getReceiverObject({ name, type, message, multipleAddresses, recipientAddresses, subject })
            }
        },
        testChannel(payload: Record<string, any>): Promise<any> {
            const { name, type, config, message = "Test Channel" } = payload;
            const { recipientAddresses, subject = "Obsrv Alert" } = config;
            const multipleAddresses = _.size(_.split(recipientAddresses, ";")) > 1;
            const alert = { annotations: { description: message }, labels: {} };
            const body = { alert, receivers: [getReceiverObject({ name, type, multipleAddresses, recipientAddresses, subject })] };
            return grafanaHttpClient.post("api/alertmanager/grafana/config/api/v1/receivers/test", body);
        }
    }
}

export default service;