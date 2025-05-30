import { StorageManager } from '../utils/storage';
import { WorkoutTemplate, TemplateExercise } from '../types/template';
import { WorkoutSession } from '../types/workout';

class TemplateService {
  private readonly TEMPLATES_KEY = 'workout_templates';
  private readonly CUSTOM_TEMPLATES_KEY = 'custom_workout_templates';
  private templateCache: WorkoutTemplate[] | null = null;

  // Get all templates (built-in + custom)
  async getAllTemplates(): Promise<WorkoutTemplate[]> {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      const [builtInTemplates, customTemplates] = await Promise.all([
        this.getBuiltInTemplates(),
        this.getCustomTemplates()
      ]);

      this.templateCache = [...builtInTemplates, ...customTemplates];
      return this.templateCache;
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }

  // Get built-in templates
  async getBuiltInTemplates(): Promise<WorkoutTemplate[]> {
    // For now, return empty array - we'll add built-in templates later
    return [];
  }

  // Get custom templates
  async getCustomTemplates(): Promise<WorkoutTemplate[]> {
    try {
      const templates = await StorageManager.getItem<WorkoutTemplate[]>(this.CUSTOM_TEMPLATES_KEY);
      return templates || [];
    } catch (error) {
      console.error('Failed to load custom templates:', error);
      return [];
    }
  }

  // Create a new template
  async createTemplate(templateData: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<WorkoutTemplate> {
    try {
      const newTemplate: WorkoutTemplate = {
        ...templateData,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isCustom: true
      };

      // Validate template data
      this.validateTemplate(newTemplate);

      // Get existing custom templates
      const customTemplates = await this.getCustomTemplates();
      
      // Check for duplicate names
      const existingNames = customTemplates.map(t => t.name.toLowerCase());
      if (existingNames.includes(newTemplate.name.toLowerCase())) {
        throw new Error('A template with this name already exists');
      }

      // Add to custom templates
      const updatedTemplates = [...customTemplates, newTemplate];
      await StorageManager.setItem(this.CUSTOM_TEMPLATES_KEY, updatedTemplates);

      // Clear cache
      this.templateCache = null;

      return newTemplate;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  // Create template from completed workout
  async createTemplateFromWorkout(
    workoutSession: WorkoutSession, 
    templateName: string, 
    templateDescription?: string
  ): Promise<WorkoutTemplate> {
    try {
      const templateExercises: TemplateExercise[] = workoutSession.exercises.map((exercise, index) => {
        const completedSets = exercise.sets.filter(set => set.completed);
        const avgReps = completedSets.length > 0 
          ? Math.round(completedSets.reduce((sum, set) => sum + (set.reps || 0), 0) / completedSets.length)
          : 8;
        const avgWeight = completedSets.length > 0
          ? Math.round(completedSets.reduce((sum, set) => sum + (set.weight || 0), 0) / completedSets.length)
          : undefined;

        return {
          id: `template_exercise_${Date.now()}_${index}`,
          exerciseId: exercise.exerciseId,
          exercise: exercise.exercise,
          order: index,
          targetSets: completedSets.length || 3,
          targetReps: avgReps,
          targetWeight: avgWeight,
          restPeriod: 90, // Default 90 seconds
          setType: 'working'
        };
      });

      const muscleGroups = [...new Set(
        workoutSession.exercises.flatMap(ex => ex.exercise.muscleGroups)
      )];

      const templateData: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
        name: templateName,
        description: templateDescription,
        category: 'custom',
        difficulty: 'intermediate',
        estimatedDuration: Math.round((workoutSession.duration || 60) / 60), // Convert to minutes
        exercises: templateExercises,
        tags: [],
        isPublic: false,
        isCustom: true,
        muscleGroups
      };

      return await this.createTemplate(templateData);
    } catch (error) {
      console.error('Failed to create template from workout:', error);
      throw error;
    }
  }

  // Update template
  async updateTemplate(templateId: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> {
    try {
      const customTemplates = await this.getCustomTemplates();
      const templateIndex = customTemplates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new Error('Template not found');
      }

      const updatedTemplate = {
        ...customTemplates[templateIndex],
        ...updates,
        updatedAt: new Date()
      };

      this.validateTemplate(updatedTemplate);

      customTemplates[templateIndex] = updatedTemplate;
      await StorageManager.setItem(this.CUSTOM_TEMPLATES_KEY, customTemplates);

      // Clear cache
      this.templateCache = null;

      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const customTemplates = await this.getCustomTemplates();
      const filteredTemplates = customTemplates.filter(t => t.id !== templateId);
      
      await StorageManager.setItem(this.CUSTOM_TEMPLATES_KEY, filteredTemplates);
      
      // Clear cache
      this.templateCache = null;
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  // Duplicate template
  async duplicateTemplate(templateId: string, newName?: string): Promise<WorkoutTemplate> {
    try {
      const templates = await this.getAllTemplates();
      const originalTemplate = templates.find(t => t.id === templateId);
      
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      const duplicatedTemplate: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
        ...originalTemplate,
        name: newName || `${originalTemplate.name} (Copy)`,
        isCustom: true,
        isPublic: false
      };

      return await this.createTemplate(duplicatedTemplate);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      throw error;
    }
  }

  // Increment usage count
  async incrementUsageCount(templateId: string): Promise<void> {
    try {
      const customTemplates = await this.getCustomTemplates();
      const templateIndex = customTemplates.findIndex(t => t.id === templateId);
      
      if (templateIndex !== -1) {
        customTemplates[templateIndex].usageCount += 1;
        await StorageManager.setItem(this.CUSTOM_TEMPLATES_KEY, customTemplates);
        this.templateCache = null;
      }
    } catch (error) {
      console.error('Failed to increment usage count:', error);
    }
  }

  // Search templates
  searchTemplates(templates: WorkoutTemplate[], query: string): WorkoutTemplate[] {
    if (!query.trim()) return templates;

    const lowerQuery = query.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.muscleGroups.some(mg => mg.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter templates by category
  filterByCategory(templates: WorkoutTemplate[], category: string): WorkoutTemplate[] {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category);
  }

  // Sort templates
  sortTemplates(templates: WorkoutTemplate[], sortBy: 'name' | 'created' | 'usage' | 'rating'): WorkoutTemplate[] {
    return [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  }

  // Validate template data
  private validateTemplate(template: WorkoutTemplate): void {
    if (!template.name || template.name.trim().length < 3) {
      throw new Error('Template name must be at least 3 characters long');
    }

    if (template.exercises.length === 0) {
      throw new Error('Template must contain at least one exercise');
    }

    if (template.estimatedDuration < 5) {
      throw new Error('Template duration must be at least 5 minutes');
    }

    // Validate exercises
    for (const exercise of template.exercises) {
      if (!exercise.exerciseId || !exercise.exercise) {
        throw new Error('All exercises must have valid exercise data');
      }

      if (exercise.targetSets < 1) {
        throw new Error('Each exercise must have at least 1 target set');
      }
    }
  }
}

export default new TemplateService(); 