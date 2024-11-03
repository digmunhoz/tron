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

        context = {
            "web_application": web_application,
        }

        return render(request, self.template_name, context)


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
