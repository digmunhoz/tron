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