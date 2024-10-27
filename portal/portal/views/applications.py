from django.views import View
from django.shortcuts import render, redirect

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

        context = {
            "web_application": web_application,
        }

        return render(request, self.template_name, context)


class ApplicationNewlView(View):
    template_name = "catalog/applications/new_application.html"

    def get(self, request):

        context = {

        }

        return render(request, self.template_name, context)