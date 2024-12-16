import json
import requests
from .exceptions import APIError


class TronAPIClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def _get(self, endpoint, params=None):
        try:
            response = requests.get(f"{self.base_url}{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return {"status": "error", "message": response.json().get("detail")}

    def _post(self, endpoint, data=None):
        try:
            response = requests.post(f"{self.base_url}{endpoint}", json=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return {"status": "error", "message": response.json().get("detail")}

    def _delete(self, endpoint):
        try:
            response = requests.delete(f"{self.base_url}{endpoint}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return {"status": "error", "message": response.json().get("detail")}

    def _put(self, endpoint, data):
        try:
            headers = {
                "content-type": "application/json",
            }
            response = requests.put(
                f"{self.base_url}{endpoint}", json=data, headers=headers
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return {"status": "error", "message": response.json().get("detail")}

    def list_workloads(self):
        return self._get("/workloads/")

    def list_clusters(self):
        return self._get("/clusters/")

    def list_environments(self):
        return self._get("/environments/")

    def list_namespaces(self):
        return self._get("/namespaces/")

    def list_webapps(self):
        return self._get("/webapps/")

    def get_webapp(self, uuid):
        return self._get(f"/webapps/{uuid}")

    def get_webapp_deploy(self, uuid):
        return self._get(f"/webapps/deploys/{uuid}")

    def put_webapp_deploy(self, uuid, data):
        return self._put(f"/webapps/deploys/{uuid}", data=data)

    def create_webapp(self, data):
        return self._post(f"/webapps/", data=data)

    def create_webapp_deploy(self, data):
        return self._post(f"/webapps/deploys/", data=data)

    def create_namespace(self, data):
        return self._post(f"/namespaces/", data=data)

    def update_namespace(self, uuid, data):
        return self._put(f"/namespaces/{uuid}", data=data)

    def delete_namespace(self, uuid):
        return self._delete(f"/namespaces/{uuid}")

    def create_cluster(self, data):
        return self._post(f"/clusters/", data=data)

    def update_cluster(self, uuid, data):
        return self._put(f"/clusters/{uuid}", data=data)

    def delete_cluster(self, uuid):
        return self._delete(f"/clusters/{uuid}")

    def create_workload(self, data):
        return self._post(f"/workloads/", data=data)

    def update_workload(self, uuid, data):
        return self._put(f"/workloads/{uuid}", data=data)

    def delete_workload(self, uuid):
        return self._delete(f"/workloads/{uuid}")

    def create_environment(self, data):
        return self._post(f"/environments/", data=data)

    def update_environment(self, uuid, data):
        return self._put(f"/environments/{uuid}", data=data)

    def delete_environment(self, uuid):
        return self._delete(f"/environments/{uuid}")