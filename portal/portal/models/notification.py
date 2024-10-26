from __future__ import unicode_literals
from django.db import models


class Notification(models.Model):

    NOTIFICATION_TYPE = [
        ("1", "info"),
        ("2", "release"),
        ("3", "warning"),
    ]

    title = models.CharField(blank=False, max_length=255)
    message = models.CharField(blank=False, max_length=255)
    type = models.CharField(blank=False, max_length=255, choices=NOTIFICATION_TYPE)
    is_active = models.BooleanField()
    date_to = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ('message', 'type')

    class Meta:
        indexes = [
            models.Index(fields=['created_at'], name='notification_created_at_idx'),
            models.Index(fields=['updated_at'], name='notification_updated_at_idx'),
        ]

    def __str__(self):
        return self.message
