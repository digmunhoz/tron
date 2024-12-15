from django.views import View
from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest
from django.contrib import messages

from portal.clients.tron_api import TronAPIClient


tron_api = TronAPIClient(base_url="http://api:8000")


class NamespacesView(View):
    template_name = "administration/namespaces/index.html"

    def post(self, request):
        name = request.POST.get("name")
        uuid = request.POST.get("uuid")
        action = request.POST.get("action")

        payload = {
            "name": name
        }

        if action == "update":
            response = tron_api.update_namespace(uuid, payload)
        elif action == "delete":
            response = tron_api.delete_namespace(uuid)
        elif action == "create":
            response = tron_api.create_namespace(payload)


        if not response.get("status") == "error":
            messages.success(request, "Operation executed successfully!")
        else:
            messages.error(request, response.get("message"))

        return redirect("namespace_index")

    def get(self, request):
        namespaces = tron_api.list_namespaces()

        context = {
            "namespaces": namespaces,
        }

        return render(request, self.template_name, context)