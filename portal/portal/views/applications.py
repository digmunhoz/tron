from django.views import View
from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest

from portal.clients.tron_api import TronAPIClient


tron_api = TronAPIClient(base_url="http://api:8000")


class ApplicationsView(View):
    template_name = "catalog/applications/index.html"

    def get(self, request):
        workloads = tron_api.list_workloads()
        environments = tron_api.list_environments()
        clusters = tron_api.list_clusters()
        namespaces = tron_api.list_namespaces()
        webapps = tron_api.list_webapps()

        context = {
            "workloads": workloads,
            "environments": environments,
            "clusters": clusters,
            "namespaces": namespaces,
            "web_applications": webapps,
        }

        return render(request, self.template_name, context)


class ApplicationDetailView(View):
    template_name = "catalog/applications/web_application_detail.html"

    def get(self, request, uuid):

        web_application = tron_api.get_webapp(uuid)
        workloads = tron_api.list_workloads()

        deploys = []

        if web_application.get("webapp_deploy"):
            for deploy in web_application.get("webapp_deploy"):
                deploys.append(tron_api.get_webapp_deploy(deploy.get("uuid")))

        context = {
            "web_application": web_application,
            "deploys": deploys,
            "workloads": workloads,
        }

        return render(request, self.template_name, context)

    def post(self, request, uuid):
        deploy_uuid = request.POST.get("deploy_uuid")
        image = request.POST.get("image")
        version = request.POST.get("version")
        workload_uuid = request.POST.get("workload")
        cpu = float(request.POST.get("cpu"))
        memory = int(request.POST.get("memory"))
        healthcheck_protocol = request.POST.get("healthcheck_protocol")
        healthcheck_path = request.POST.get("healthcheck_path")
        healthcheck_port = int(request.POST.get("healthcheck_port"))
        healthcheck_initial_interval = int(request.POST.get("healthcheck_initial_interval"))
        healthcheck_interval = int(request.POST.get("healthcheck_interval"))
        healthcheck_timeout = int(request.POST.get("healthcheck_timeout"))
        healthcheck_failure_threshold = int(request.POST.get(
            "healthcheck_failure_threshold"
        ))
        cpu_threshold = int(request.POST.get("cpu_threshold"))
        memory_threshold = int(request.POST.get("memory_threshold"))
        custom_metrics_enabled = request.POST.get("custom_metrics_enabled")
        custom_metrics_enabled_converted = custom_metrics_enabled.lower() == "true"
        custom_metrics_port = int(request.POST.get("custom_metrics_port"))
        custom_metrics_path = request.POST.get("custom_metrics_path")
        secrets = []
        endpoint_source_protocols = request.POST.getlist("source_protocol[]")
        endpoint_source_ports = request.POST.getlist("source_port[]")
        endpoint_dest_protocols = request.POST.getlist("destination_protocol[]")
        endpoint_dest_ports = request.POST.getlist("destination_port[]")
        env_keys = request.POST.getlist("env_key[]")
        env_values = request.POST.getlist("env_value[]")

        envs = [{'key': key, 'value': value} for key, value in zip(env_keys, env_values)]
        endpoints = []

        if (
            len(endpoint_source_protocols)
            == len(endpoint_source_ports)
            == len(endpoint_dest_protocols)
            == len(endpoint_dest_ports)
        ):
            for i in range(len(endpoint_source_protocols)):
                endpoint = {
                    "source_protocol": endpoint_source_protocols[i],
                    "source_port": int(endpoint_source_ports[i]),
                    "dest_protocol": endpoint_dest_protocols[i],
                    "dest_port": int(endpoint_dest_ports[i]),
                }
                endpoints.append(endpoint)

        payload = {
            "image": image,
            "version": version,
            "workload_uuid": workload_uuid,
            "custom_metrics": {
                "enabled": custom_metrics_enabled_converted,
                "path": custom_metrics_path,
                "port": custom_metrics_port,
            },
            "endpoints": endpoints,
            "envs": envs,
            "secrets": secrets,
            "cpu_scaling_threshold": cpu_threshold,
            "memory_scaling_threshold": memory_threshold,
            "healthcheck": {
                "path": healthcheck_path,
                "protocol": healthcheck_protocol,
                "port": healthcheck_port,
                "timeout": healthcheck_timeout,
                "interval": healthcheck_interval,
                "initial_interval": healthcheck_initial_interval,
                "failure_threshold": healthcheck_failure_threshold,
            },
            "cpu": cpu,
            "memory": memory,
        }

        tron_api.put_webapp_deploy(deploy_uuid, payload)

        return redirect(f"/applications/{uuid}")


class ApplicationNewlView(View):
    template_name = "catalog/applications/new_application.html"

    def get(self, request):
        namespaces = tron_api.list_namespaces()

        context = {"namespaces": namespaces}

        return render(request, self.template_name, context)

    def post(self, request):
        application_name = request.POST.get("application_name")
        application_type = request.POST.get("application_type")
        application_namespace_uuid = request.POST.get("application_namespace")
        application_visibility = request.POST.get("application_visibility")

        if not all(
            [
                application_name,
                application_type,
                application_namespace_uuid,
                application_visibility,
            ]
        ):
            return HttpResponseBadRequest("All fields are requireds")

        application_data = {
            "name": application_name,
            "private": False if application_visibility == "public" else True,
            "namespace_uuid": application_namespace_uuid,
        }

        if application_type == "webapp":
            tron_api.create_webapp(application_data)

        return redirect("applications_index")
