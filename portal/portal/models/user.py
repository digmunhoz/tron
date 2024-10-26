from __future__ import unicode_literals
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    key = models.CharField(blank=True, default='', max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['created_at'], name='users_created_at_idx'),
            models.Index(fields=['updated_at'], name='users_updated_at_idx'),
            models.Index(fields=['email'], name='users_email_idx'),
        ]

    def __str__(self):
        return self.email
