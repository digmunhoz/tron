from django.views import View
from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest
from django.contrib import messages

from portal.clients.tron_api import TronAPIClient


tron_api = TronAPIClient(base_url="http://api:8000")


class EnvironmentsView(View):
    template_name = "administration/environments/index.html"

    def post(self, request):
        name = request.POST.get("name")
        uuid = request.POST.get("uuid")
        action = request.POST.get("action")

        payload = {
            "name": name
        }

        if action == "update":
            response = tron_api.update_environment(uuid, payload)
        elif action == "delete":
            response = tron_api.delete_environment(uuid)
        elif action == "create":
            response = tron_api.create_environment(payload)


        if not response.get("status") == "error":
            messages.success(request, "Operation executed successfully!")
        else:
            messages.error(request, response.get("message"))

        return redirect("environment_index")

    def get(self, request):
        environments = tron_api.list_environments()

        context = {
            "environments": environments,
        }

        return render(request, self.template_name, context)