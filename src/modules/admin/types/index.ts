export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}
