"""
Projects Models — Project Evolution and ZIP File Analysis
"""
import os
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


def project_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    name = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('projects', str(instance.project.user.id), str(instance.project.id), name)


class Project(models.Model):
    """
    A student's software project. Contains multiple versions over time.
    """
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    language    = models.CharField(max_length=50, default='python')
    status      = models.CharField(max_length=20, default='active')
    code        = models.TextField(blank=True, default='# Write your project code here\n')

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects_project'
        ordering = ['-updated_at']


    def __str__(self):
        return f'{self.user.email} -> {self.name}'


class ProjectVersion(models.Model):
    """
    A specific uploaded version (ZIP file) of a project.
    """
    project      = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='versions')
    version_num  = models.IntegerField(default=1)
    
    zip_file     = models.FileField(upload_to=project_upload_path)
    
    # Overall score 0-100 given by AI review
    quality_score = models.FloatField(null=True, blank=True)
    
    # General feedback from the AI
    summary_feedback = models.TextField(blank=True, default='')

    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'projects_version'
        ordering = ['-version_num']
        unique_together = ('project', 'version_num')

    def __str__(self):
        return f'{self.project.name} v{self.version_num}'

    def save(self, *args, **kwargs):
        if not self.pk and self.project:
            # Auto-increment version number
            last = self.project.versions.order_by('-version_num').first()
            if last:
                self.version_num = last.version_num + 1
        super().save(*args, **kwargs)


class FileAnalysis(models.Model):
    """
    AI feedback for a specific file inside a ProjectVersion.
    """
    version   = models.ForeignKey(ProjectVersion, on_delete=models.CASCADE, related_name='file_analyses')
    file_path = models.CharField(max_length=500)
    
    # The actual file content at the time of upload
    content   = models.TextField()
    
    # AI review for this specific file
    feedback  = models.TextField()
    score     = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'projects_file_analysis'
        ordering = ['file_path']

    def __str__(self):
        return f'{self.version} - {self.file_path}'
