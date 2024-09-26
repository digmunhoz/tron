import yaml

from jinja2 import Environment, FileSystemLoader


FILES = ["deployment.yaml.j2", "hpa.yaml.j2", "service.yaml.j2"]


class KubernetesWebAppInstanceManager:
    def __init__(self, k8s_client):
        self.k8s_client = k8s_client

    def instance_management(
        self,
        webapp_deploy: dict,
        operation,
    ):

        combined_payloads = []

        for file in FILES:
            combined_payloads.append(self.load_template(file, webapp_deploy))

        return self.k8s_client.apply_or_delete_yaml_to_k8s(combined_payloads, operation=operation)

    def load_template(self, template_name, variables):

        env = Environment(loader=FileSystemLoader("app/k8s/templates/webapp"))

        try:
            template = env.get_template(template_name)
        except Exception as e:
            raise FileNotFoundError(f"Template {template_name} not found")

        rendered_yaml = template.render(variables)

        try:
            return yaml.safe_load(rendered_yaml)
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing YAML template {template_name}")
