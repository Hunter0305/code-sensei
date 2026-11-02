from django.contrib import admin
from .models import LearningRoadmap, RoadmapNode


class RoadmapNodeInline(admin.TabularInline):
    model = RoadmapNode
    extra = 0


@admin.register(LearningRoadmap)
class LearningRoadmapAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_active', 'created_at')
    list_filter  = ('is_active',)
    search_fields = ('user__email', 'title')
    inlines = [RoadmapNodeInline]

@admin.register(RoadmapNode)
class RoadmapNodeAdmin(admin.ModelAdmin):
    list_display = ('roadmap', 'concept', 'order', 'status')
    list_filter  = ('status',)
