'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { GearCard } from '@/components/features/gear/GearCard';
import { Plus, Package, History } from '@/components/ui/icons';
import { Card, PrimaryButton, Modal, Input } from '@/components/ui';
import { toast } from 'sonner';

interface Gear {
  id: number;
  name: string;
  brand: string;
  model: string;
  type: string;
  current_distance: number;
  max_distance: number;
  is_active: boolean | number;
}

export default function GearPage() {
  const [gearList, setGearList] = useState<Gear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGear, setEditingGear] = useState<Gear | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    type: 'shoes',
    max_distance: 800,
    initial_distance: 0
  });

  const fetchGear = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getGear();
      setGearList(data);
    } catch (error) {
      toast.error('Impossible de charger le mat\u00e9riel');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGear();
  }, [fetchGear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGear) {
        await api.updateGear(editingGear.id, formData);
        toast.success('Mat\u00e9riel mis \u00e0 jour');
      } else {
        await api.createGear(formData);
        toast.success('Nouveau mat\u00e9riel ajout\u00e9');
      }
      setIsModalOpen(false);
      setEditingGear(null);
      setFormData({ name: '', brand: '', model: '', type: 'shoes', max_distance: 800, initial_distance: 0 });
      fetchGear();
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const handleEdit = (gear: Gear) => {
    setEditingGear(gear);
    setFormData({
      name: gear.name,
      brand: gear.brand,
      model: gear.model,
      type: gear.type,
      max_distance: gear.max_distance,
      initial_distance: gear.current_distance
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer ou archiver ce mat\u00e9riel ?')) {
      try {
        await api.deleteGear(id);
        toast.success('Action effectu\u00e9e');
        fetchGear();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const activeGear = gearList.filter(g => g.is_active);
  const archivedGear = gearList.filter(g => !g.is_active);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex justify-between items-center pt-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Mon Mat\u00e9riel</h1>
            <p className="text-muted mt-1.5">Suivez l&apos;usure de vos chaussures et \u00e9quipements pour pr\u00e9venir les blessures.</p>
          </div>
          <PrimaryButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingGear(null);
              setFormData({ name: '', brand: '', model: '', type: 'shoes', max_distance: 800, initial_distance: 0 });
              setIsModalOpen(true);
            }}
          >
            Ajouter du mat\u00e9riel
          </PrimaryButton>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : gearList.length === 0 ? (
          <Card variant="bordered" padding="xl" className="text-center">
            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Aucun mat\u00e9riel enregistr\u00e9</h3>
            <p className="text-muted mb-6 max-w-sm mx-auto">
              Commencez par ajouter vos chaussures de running ou votre v\u00e9lo pour suivre leur kilom\u00e9trage.
            </p>
            <PrimaryButton variant="outline" onClick={() => setIsModalOpen(true)}>
              Ajouter ma premi\u00e8re paire
            </PrimaryButton>
          </Card>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGear.map(gear => (
                <GearCard key={gear.id} gear={gear} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>

            {archivedGear.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted">
                  <History className="w-4 h-4" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Mat\u00e9riel Archiv\u00e9</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedGear.map(gear => (
                    <GearCard key={gear.id} gear={gear} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingGear ? 'Modifier le mat\u00e9riel' : 'Ajouter du mat\u00e9riel'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input
              label="Nom du mat\u00e9riel"
              placeholder="ex: Pegasus 40, Speed Concept..."
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Marque"
                placeholder="ex: Nike, Trek..."
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
              />
              <Input
                label="Mod\u00e8le"
                placeholder="ex: v4, 2024..."
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted ml-1">Type</label>
                <select
                  className="w-full h-11 bg-surface border border-border rounded-xl px-4 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="shoes">Chaussures</option>
                  <option value="bike">V\u00e9lo</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <Input
                label="Distance max (km)"
                type="number"
                value={formData.max_distance}
                onChange={(e) => setFormData({...formData, max_distance: parseInt(e.target.value)})}
              />
            </div>
            {!editingGear && (
              <Input
                label="Kilom\u00e9trage initial (km)"
                type="number"
                value={formData.initial_distance}
                onChange={(e) => setFormData({...formData, initial_distance: parseInt(e.target.value)})}
              />
            )}
            <div className="pt-4 flex justify-end gap-3">
              <PrimaryButton variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </PrimaryButton>
              <PrimaryButton variant="primary" type="submit">
                {editingGear ? 'Sauvegarder' : 'Ajouter'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
