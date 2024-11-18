from django import template
from django.urls import reverse

register = template.Library()

@register.simple_tag
def generate_breadcrumbs(request):
    path = request.path.strip('/').split('/')
    breadcrumbs = []
    url = ''

    for segment in path:
        url += f'/{segment}'
        breadcrumb_name = segment.replace('-', ' ').capitalize()
        breadcrumbs.append({'name': breadcrumb_name, 'url': url})

    return breadcrumbs


@register.filter
def map_attribute(value, attribute):
    """
    Extrai um atributo de cada item de uma lista de objetos ou dicionários.
    Exemplo: webapp_deploy|map_attribute:"environment.name"
    """
    keys = attribute.split(".")
    def get_nested_attr(obj, keys):
        for key in keys:
            obj = obj.get(key) if isinstance(obj, dict) else getattr(obj, key, None)
        return obj

    return [get_nested_attr(item, keys) for item in value]