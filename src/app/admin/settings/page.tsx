'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-600">
          Configure your admin panel preferences and system settings.
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">General Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Company Name
            </label>
            <Input
              type="text"
              defaultValue="Your Company Name"
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Company Email
            </label>
            <Input
              type="email"
              defaultValue="admin@company.com"
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Support Email
            </label>
            <Input
              type="email"
              defaultValue="support@company.com"
              className="mt-2"
            />
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-600">
                Receive email for important events
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Admin Changes</p>
              <p className="text-sm text-slate-600">
                Notify when new admins are added or permissions changed
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Employee Updates</p>
              <p className="text-sm text-slate-600">
                Notify for new employee records
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Two-Factor Authentication</p>
              <p className="text-sm text-slate-600">
                Enhance account security with 2FA
              </p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Change Password</p>
              <p className="text-sm text-slate-600">
                Update your account password
              </p>
            </div>
            <Button variant="outline">Change</Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Session Timeout</p>
              <p className="text-sm text-slate-600">
                Auto logout after inactivity (in minutes)
              </p>
            </div>
            <Input type="number" defaultValue="30" className="w-20" />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <div className="p-6 border-b border-red-200">
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Export All Data</p>
              <p className="text-sm text-slate-600">
                Download a backup of all employee data
              </p>
            </div>
            <Button variant="outline">Export</Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Reset All Data</p>
              <p className="text-sm text-slate-600">
                This action cannot be undone
              </p>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              Reset
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
