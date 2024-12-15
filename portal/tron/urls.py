"""
URL configuration for tron project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from portal.views import ApplicationsView, ApplicationDetailView, ApplicationNewlView
from portal.views import HomeView
from portal.views import NamespacesView
from portal.views import EnvironmentsView
from portal.views import ClustersView
from portal.views import WorkloadsView

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('', HomeView.as_view(), name='home'),
    path('applications/', ApplicationsView.as_view(), name='applications_index'),
    path('applications/<uuid:uuid>/', ApplicationDetailView.as_view(), name='application_detail'),
    path('applications/new/', ApplicationNewlView.as_view(), name='application_new'),
    path('namespaces/', NamespacesView.as_view(), name='namespace_index'),
    path('environments/', EnvironmentsView.as_view(), name='environment_index'),
    path('workloads/', WorkloadsView.as_view(), name='workload_index'),
    path('clusters/', ClustersView.as_view(), name='cluster_index'),
]
