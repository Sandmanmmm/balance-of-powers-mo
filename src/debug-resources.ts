// Debug test for resources loading
import { getResources } from './data/gameData';

export async function testResourcesLoading() {
  try {
    console.log('Testing resources loading...');
    const resources = await getResources();
    console.log('Resources loaded successfully:', resources?.length || 0, 'resources');
    console.log('Sample resource:', resources?.[0]);
    return true;
  } catch (error) {
    console.error('Failed to load resources:', error);
    return false;
  }
}

// Auto-run test
testResourcesLoading();