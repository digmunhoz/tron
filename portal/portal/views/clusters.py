from django.views import View
from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest
from django.contrib import messages

from portal.clients.tron_api import TronAPIClient


tron_api = TronAPIClient(base_url="http://api:8000")


class ClustersView(View):
    template_name = "administration/clusters/index.html"

    def post(self, request):
        name = request.POST.get("name")
        uuid = request.POST.get("uuid")
        api = request.POST.get("api")
        environment_uuid = request.POST.get("environment_uuid")
        token = request.POST.get("token")
        action = request.POST.get("action")

        payload = {
            "name": name,
            "api_address": api,
            "environment_uuid": environment_uuid,
            "token": token,
        }

        if action == "update":
            response = tron_api.update_cluster(uuid, payload)
        elif action == "delete":
            response = tron_api.delete_cluster(uuid)
        elif action == "create":
            response = tron_api.create_cluster(payload)


        if not response.get("status") == "error":
            messages.success(request, "Operation executed successfully!")
        else:
            messages.error(request, response.get("message"))

        return redirect("cluster_index")

    def get(self, request):
        clusters = tron_api.list_clusters()

        context = {
            "clusters": clusters,
        }

        return render(request, self.template_name, context)