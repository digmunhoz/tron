import yaml
from typing import Optional

from jinja2 import Environment, FileSystemLoader


FILES = ["deployment.yaml.j2", "hpa.yaml.j2", "service.yaml.j2"]


class KubernetesWebAppInstanceManager:

    def instance_management(webapp_deploy: dict, settings: Optional[dict] = {}):

        combined_payloads = []

        variables = {}
        variables.update(
            {"application_settings": webapp_deploy, "environment_settings": settings}
        )

        for file in FILES:
            combined_payloads.append(
                KubernetesWebAppInstanceManager.load_template(file, variables)
            )

        return combined_payloads

    def load_template(template_name, variables):

        env = Environment(loader=FileSystemLoader("app/k8s/templates/webapp"))

        try:
            template = env.get_template(template_name)
        except Exception as e:
            raise FileNotFoundError(f"Template {template_name} rendering error: {e}")

        rendered_yaml = template.render(variables)

        try:
            return yaml.safe_load(rendered_yaml)
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing YAML template {template_name}")
