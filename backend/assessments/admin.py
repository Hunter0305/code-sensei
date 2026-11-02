from django.contrib import admin
from .models import Problem, TestCase, Submission


class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'concept', 'updated_at')
    list_filter  = ('difficulty', 'concept')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [TestCaseInline]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'problem', 'passed', 'created_at')
    list_filter  = ('passed', 'problem')
    search_fields = ('user__email', 'problem__title')
    readonly_fields = ('created_at',)
