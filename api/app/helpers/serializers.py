
def serialize_application_component(application_component):
    """
    Serializa um ApplicationComponent para uso nos templates Kubernetes.
    Inclui informações do componente, instância, aplicação e ambiente.
    """
    return {
        "component_name": application_component.name,
        "component_uuid": str(application_component.uuid),
        "component_type": application_component.type.value if hasattr(application_component.type, 'value') else str(application_component.type),
        "application_name": application_component.instance.application.name,
        "application_uuid": str(application_component.instance.application.uuid),
        "environment": application_component.instance.environment.name,
        "environment_uuid": str(application_component.instance.environment.uuid),
        "image": application_component.instance.image,
        "version": application_component.instance.version,
        "is_public": application_component.is_public,
        "url": application_component.url,
        "enabled": application_component.enabled,
        "settings": application_component.settings or {}
    }

# Mantido para compatibilidade (deprecated)
def serialize_webapp_deploy(webapp_deploy):
    return serialize_application_component(webapp_deploy)

def serialize_settings(settings):

    serialized_settings = {}

    for item in settings:
        serialized_settings.update({
            item.key: item.value
        })

    return serialized_settings