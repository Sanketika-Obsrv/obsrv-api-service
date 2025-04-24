const templates = {
    "email": "{{ define \"email\" }}\n{{ range .Alerts.Firing }}\n[{{.Labels.severity | toUpper }}] {{ .Annotations.description }}\n{{ end }}\n{{ end }}",
    "slack_title": "{{ define \"slack_title\" }}\n[{{ .Status | toUpper }}: {{ if eq .Status \"firing\" }}{{ .Alerts.Firing | len }}{{ else if eq .Status \"resolved\" }}{{.Alerts.Resolved | len }}{{ end }}] {{ .GroupLabels.SortedPairs.Values | join \" \" }}\n{{ end }}",
    "slack_body": "{{ define \"slack_body\" -}}\n{{- $status := \"resolved\" -}}\n{{ range $index, $alert := .Alerts }}\n{{ if eq $index  0 }}\n Severity: {{ .Labels.severity }}\n Description: {{ .Annotations.description }}\n Status: {{ .Status }}\n{{ end }}\n{{ end }}\n{{ end }}",
    "teams.alerts.title": "{{ define \"teams.alerts.title\" }}\n{{ .CommonLabels.alertname }}\n{{ end }}",
    "teams.alerts.message": "{{ define \"teams.alerts.message\" }}\n\n{{ if gt (len .Alerts.Firing) 0 }} **Firing**\n{{ template \"__teams_text_alert_list\" .Alerts.Firing }}{{ if gt (len .Alerts.Resolved) 0 }}\n\n{{ end }}\n{{ end }}\n{{ if gt (len .Alerts.Resolved) 0 }}**Resolved**\n{{ template \"__teams_text_alert_list\" .Alerts.Resolved }}{{ end }}{{ end }}\n\n{{ define \"__teams_text_alert_list\" }}\n{{ range . }}\n\n{{ if gt (len .Labels.severity) 0 }}\nSeverity = {{ .Labels.severity }}\n{{ end }}\nDescription = {{ .Annotations.description }}\n{{ end }}\n{{ end }}"
}

export default templates;