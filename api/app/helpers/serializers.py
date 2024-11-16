
def serialize_webapp_deploy(webapp_deploy):
    return {
        "webapp_name": webapp_deploy.webapp.name,
        "webapp_uuid": webapp_deploy.webapp.uuid,
        "namespace_name": webapp_deploy.webapp.namespace.name,
        "namespace_uuid": webapp_deploy.webapp.namespace.uuid,
        "environment": webapp_deploy.environment.name,
        "workload": webapp_deploy.workload.name,
        "image": webapp_deploy.image,
        "version": webapp_deploy.version,
        "cpu_scaling_threshold": webapp_deploy.cpu_scaling_threshold,
        "memory_scaling_threshold": webapp_deploy.memory_scaling_threshold,
        "envs": [env for env in webapp_deploy.envs],
        "secrets": [secret for secret in webapp_deploy.secrets],
        "custom_metrics": webapp_deploy.custom_metrics,
        "healthcheck": webapp_deploy.healthcheck,
        "endpoints": webapp_deploy.endpoints,
        "cpu": webapp_deploy.cpu,
        "memory": webapp_deploy.memory
    }

def serialize_settings(settings):

    serialized_settings = {}

    for item in settings:
        serialized_settings.update({
            item.key: item.value
        })

    return serialized_settings