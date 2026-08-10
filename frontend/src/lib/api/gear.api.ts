import { client } from './client';

export interface Gear {
  id: number;
  user_id: number;
  name: string;
  brand: string;
  model: string;
  type: string;
  purchase_date: string;
  current_distance: number;
  max_distance: number;
  is_active: boolean | number;
}

export interface CreateGearParams {
  name: string;
  brand?: string;
  model?: string;
  type: string;
  purchase_date?: string;
  initial_distance?: number;
  max_distance?: number;
  [key: string]: unknown;
}

export interface UpdateGearParams extends Partial<CreateGearParams> {
  is_active?: boolean | number;
  [key: string]: unknown;
}

export const gearApi = {
  /**
   * Get all gear for current user
   */
  getGear: () => client.get<Gear[]>('/gear'),

  /**
   * Create new gear
   */
  createGear: (data: CreateGearParams) => client.post<{ id: number; message: string }>('/gear', data),

  /**
   * Update existing gear
   */
  updateGear: (id: number, data: UpdateGearParams) => client.put<{ message: string }>(`/gear/${id}`, data),

  /**
   * Delete or archive gear
   */
  deleteGear: (id: number) => client.delete<{ message: string }>(`/gear/${id}`),

  /**
   * Link gear to an activity
   */
  linkToActivity: (activityId: number, gearId: number | null) =>
    client.put<{ message: string }>(`/activities/${activityId}`, { gear_id: gearId }),
};
