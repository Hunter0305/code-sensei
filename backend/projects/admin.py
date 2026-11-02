from django.contrib import admin
from .models import Project, ProjectVersion, FileAnalysis


class FileAnalysisInline(admin.TabularInline):
    model = FileAnalysis
    extra = 0
    readonly_fields = ('file_path', 'score')


class ProjectVersionInline(admin.TabularInline):
    model = ProjectVersion
    extra = 0
    readonly_fields = ('version_num', 'quality_score', 'created_at')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'updated_at')
    search_fields = ('user__email', 'name')
    inlines = [ProjectVersionInline]


@admin.register(ProjectVersion)
class ProjectVersionAdmin(admin.ModelAdmin):
    list_display = ('project', 'version_num', 'quality_score', 'created_at')
    list_filter  = ('project',)
    inlines = [FileAnalysisInline]
