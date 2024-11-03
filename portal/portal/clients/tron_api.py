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
        except requests.RequestException as e:
            raise APIError(f"Error fetching data: {str(e)}")

    def _post(self, endpoint, data=None):
        try:
            response = requests.post(f"{self.base_url}{endpoint}", json=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Error posting data: {str(e)}")

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

    def create_webapp(self, data):
        return self._post(f"/webapps/", data=data)

    def create_webapp_deploy(self, data):
        return self._post(f"/webapps/deploys/", data=data)
