// src/services/muscleGroupService.ts

export type MuscleGroupCategory = 'primary' | 'secondary' | 'stabilizer';
export type BodyRegion = 'upper' | 'lower' | 'core';

export interface MuscleGroup {
  id: string;
  name: string;
  region: BodyRegion;
  category: MuscleGroupCategory[];
  antagonists: string[]; // muscle group ids
  synergists: string[];  // muscle group ids
  description?: string;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  // UPPER BODY - PUSH
  {
    id: 'chest',
    name: 'Chest',
    region: 'upper',
    category: ['primary'],
    antagonists: ['lats'],
    synergists: ['front_delts', 'triceps'],
    description: 'Pectoralis major and minor'
  },
  {
    id: 'front_delts',
    name: 'Front Delts',
    region: 'upper',
    category: ['primary'],
    antagonists: ['rear_delts'],
    synergists: ['chest', 'triceps'],
    description: 'Anterior deltoids'
  },
  {
    id: 'side_delts',
    name: 'Side Delts',
    region: 'upper',
    category: ['primary'],
    antagonists: [],
    synergists: ['front_delts', 'rear_delts'],
    description: 'Medial deltoids'
  },
  {
    id: 'triceps',
    name: 'Triceps',
    region: 'upper',
    category: ['primary'],
    antagonists: ['biceps'],
    synergists: ['chest', 'front_delts'],
    description: 'Triceps brachii'
  },

  // UPPER BODY - PULL
  {
    id: 'lats',
    name: 'Lats',
    region: 'upper',
    category: ['primary'],
    antagonists: ['chest'],
    synergists: ['rhomboids', 'biceps', 'rear_delts'],
    description: 'Latissimus dorsi'
  },
  {
    id: 'rhomboids',
    name: 'Mid Traps/Rhomboids',
    region: 'upper',
    category: ['primary'],
    antagonists: [],
    synergists: ['lats', 'rear_delts'],
    description: 'Middle trapezius and rhomboids'
  },
  {
    id: 'rear_delts',
    name: 'Rear Delts',
    region: 'upper',
    category: ['primary'],
    antagonists: ['front_delts'],
    synergists: ['rhomboids', 'lats'],
    description: 'Posterior deltoids'
  },
  {
    id: 'biceps',
    name: 'Biceps',
    region: 'upper',
    category: ['primary'],
    antagonists: ['triceps'],
    synergists: ['lats', 'rhomboids'],
    description: 'Biceps brachii and brachialis'
  },

  // CORE
  {
    id: 'abs',
    name: 'Abs',
    region: 'core',
    category: ['primary'],
    antagonists: ['lower_back'],
    synergists: ['obliques'],
    description: 'Rectus abdominis'
  },
  {
    id: 'obliques',
    name: 'Obliques',
    region: 'core',
    category: ['primary'],
    antagonists: [],
    synergists: ['abs'],
    description: 'Internal and external obliques'
  },
  {
    id: 'lower_back',
    name: 'Lower Back',
    region: 'core',
    category: ['primary'],
    antagonists: ['abs'],
    synergists: ['glutes'],
    description: 'Erector spinae and multifidus'
  },

  // LOWER BODY
  {
    id: 'quads',
    name: 'Quads',
    region: 'lower',
    category: ['primary'],
    antagonists: ['hamstrings'],
    synergists: ['glutes'],
    description: 'Quadriceps femoris group'
  },
  {
    id: 'hamstrings',
    name: 'Hamstrings',
    region: 'lower',
    category: ['primary'],
    antagonists: ['quads'],
    synergists: ['glutes', 'lower_back'],
    description: 'Biceps femoris, semitendinosus, semimembranosus'
  },
  {
    id: 'glutes',
    name: 'Glutes',
    region: 'lower',
    category: ['primary'],
    antagonists: [],
    synergists: ['hamstrings', 'lower_back'],
    description: 'Gluteus maximus, medius, and minimus'
  },
  {
    id: 'calves',
    name: 'Calves',
    region: 'lower',
    category: ['primary'],
    antagonists: [],
    synergists: [],
    description: 'Gastrocnemius and soleus'
  },

  // SECONDARY/STABILIZER GROUPS
  {
    id: 'traps',
    name: 'Upper Traps',
    region: 'upper',
    category: ['secondary', 'stabilizer'],
    antagonists: [],
    synergists: ['rhomboids', 'rear_delts'],
    description: 'Upper trapezius'
  },
  {
    id: 'forearms',
    name: 'Forearms',
    region: 'upper',
    category: ['secondary', 'stabilizer'],
    antagonists: [],
    synergists: ['biceps'],
    description: 'Forearm flexors and extensors'
  }
];

// Helper function to get muscle groups by category
export const getMuscleGroupsByCategory = (category: MuscleGroupCategory) => {
  return MUSCLE_GROUPS.filter(group => group.category.includes(category));
};

// Helper function to get antagonist muscle groups
export const getAntagonistGroups = (muscleGroupId: string) => {
  const group = MUSCLE_GROUPS.find(g => g.id === muscleGroupId);
  if (!group) return [];
  
  return MUSCLE_GROUPS.filter(g => group.antagonists.includes(g.id));
};

// Helper function to get synergist muscle groups
export const getSynergistGroups = (muscleGroupId: string) => {
  const group = MUSCLE_GROUPS.find(g => g.id === muscleGroupId);
  if (!group) return [];
  
  return MUSCLE_GROUPS.filter(g => group.synergists.includes(g.id));
};

export class MuscleGroupService {
  static getAll(): MuscleGroup[] {
    return MUSCLE_GROUPS;
  }

  static getById(id: string): MuscleGroup | undefined {
    return MUSCLE_GROUPS.find(mg => mg.id === id);
  }

  static search(query: string): MuscleGroup[] {
    const q = query.toLowerCase();
    return MUSCLE_GROUPS.filter(mg =>
      mg.name.toLowerCase().includes(q) || mg.id.toLowerCase().includes(q)
    );
  }

  static getByRegion(region: BodyRegion): MuscleGroup[] {
    return MUSCLE_GROUPS.filter(mg => mg.region === region);
  }

  static getAntagonists(id: string): MuscleGroup[] {
    const mg = this.getById(id);
    return mg ? mg.antagonists.map(aid => this.getById(aid)).filter(Boolean) as MuscleGroup[] : [];
  }

  static getSynergists(id: string): MuscleGroup[] {
    const mg = this.getById(id);
    return mg ? mg.synergists.map(sid => this.getById(sid)).filter(Boolean) as MuscleGroup[] : [];
  }

  static getBalance(exerciseMuscleGroups: string[]): { [region in BodyRegion]: number } {
    // Simple count of muscle groups per region for balance analytics
    const balance: { [region in BodyRegion]: number } = { upper: 0, lower: 0, core: 0 };
    exerciseMuscleGroups.forEach(id => {
      const mg = this.getById(id);
      if (mg) balance[mg.region]++;
    });
    return balance;
  }

  static getComplementaryExercises(muscleGroupId: string, allExercises: { muscleGroups: string[] }[]): { muscleGroup: MuscleGroup, exercises: any[] }[] {
    // Suggest exercises for antagonist/synergist muscle groups
    const antagonists = this.getAntagonists(muscleGroupId);
    const synergists = this.getSynergists(muscleGroupId);
    const related = [...antagonists, ...synergists];
    return related.map(mg => ({
      muscleGroup: mg,
      exercises: allExercises.filter(ex => ex.muscleGroups.includes(mg.id))
    }));
  }
}

export default MuscleGroupService;