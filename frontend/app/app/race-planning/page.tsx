/**
 * Race Planning Page
 * ==================
 * Outil de stratégie de course avec calcul des splits,
 * zones de fréquence cardiaque et stratégie de nutrition.
 */

import { RacePlanningContent } from './RacePlanningContent';

export const metadata = {
  title: 'Race Planning - DrawRun',
  description: 'Planifiez votre stratégie de course avec des splits détaillés',
};

export default function RacePlanningPage() {
  return <RacePlanningContent />;
}
