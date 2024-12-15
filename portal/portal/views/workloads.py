from django.views import View
from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest
from django.contrib import messages

from portal.clients.tron_api import TronAPIClient


tron_api = TronAPIClient(base_url="http://api:8000")


class WorkloadsView(View):
    template_name = "administration/workloads/index.html"

    def post(self, request):
        name = request.POST.get("name")
        uuid = request.POST.get("uuid")
        action = request.POST.get("action")

        payload = {
            "name": name
        }

        if action == "update":
            response = tron_api.update_workload(uuid, payload)
        elif action == "delete":
            response = tron_api.delete_workload(uuid)
        elif action == "create":
            response = tron_api.create_workload(payload)


        if not response.get("status") == "error":
            messages.success(request, "Operation executed successfully!")
        else:
            messages.error(request, response.get("message"))

        return redirect("workload_index")

    def get(self, request):
        workloads = tron_api.list_workloads()

        context = {
            "workloads": workloads,
        }

        return render(request, self.template_name, context)