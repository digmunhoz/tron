from django.views import View
from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest

from portal.clients.tron_api import TronAPIClient


tron_api = TronAPIClient(base_url="http://api:8000")


class SettingsView(View):
    template_name = "administration/settings/index.html"

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
