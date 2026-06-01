'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, FileText } from 'lucide-react';
import { usePagePermission } from '@/hooks/usePagePermission';

export default function SettingsPage() {
  const { canUpdate, loading } = usePagePermission("settings");
  const { user, updateProfileName, updateUserPreferences } = useAuth();
  
  // Personal Info form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  
  // Manage loading/success states
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalSaveSuccess, setPersonalSaveSuccess] = useState(false);
  const [personalSaveError, setPersonalSaveError] = useState<string | null>(null);

  // Pre-populate when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      // Appwrite prefs are a key-value store typed as Models.Preferences
      const prefs = user.prefs as Record<string, string>;
      setPhone(prefs?.phone || '');
      setJobTitle(prefs?.jobTitle || '');
      setBio(prefs?.bio || '');
    }
  }, [user]);

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);
    setPersonalSaveError(null);
    setPersonalSaveSuccess(false);

    try {
      // 1. Update name
      if (name !== user?.name) {
        await updateProfileName(name);
      }
      
      // 2. Update preferences
      const existingPrefs = user?.prefs || {};
      const newPrefs = {
        ...existingPrefs,
        phone,
        jobTitle,
        bio,
      };
      await updateUserPreferences(newPrefs);
      
      setPersonalSaveSuccess(true);
      setTimeout(() => setPersonalSaveSuccess(false), 3000); // clear success msg after 3s
    } catch (error: any) {
      setPersonalSaveError(error.message || 'Failed to update personal information');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Setup */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your public profile and login details.</p>
        </div>

        <div className="p-6 space-y-6">
          {personalSaveError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {personalSaveError}
            </div>
          )}
          {personalSaveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md border border-emerald-200">
              Personal information updated successfully.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Full Name
              </label>
              <Input
                type="text"
                placeholder={user?.email.split('@')[0] || 'Your Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || !canUpdate}
                className="transition-colors focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                Email Address
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-slate-50 text-slate-500 cursor-not-allowed"
                title="Email updates are disabled for now."
              />
              <p className="text-xs text-slate-400">Email cannot be changed currently.</p>
            </div>

            {/* <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Job Title
              </label>
              <Input
                type="text"
                placeholder="Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="transition-colors focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="transition-colors focus-visible:ring-blue-500"
              />
            </div> */}
          </div>
{/* 
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              Bio
            </label>
            <textarea
              placeholder="Tell us a little bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            />
          </div> */}

          <Button 
            onClick={handleSavePersonal}
            disabled={isSavingPersonal || loading || !canUpdate}
            className="transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingPersonal ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>

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
              defaultValue="Airvincible"
              disabled={loading || !canUpdate}
              className="mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Company Email
            </label>
            <Input
              type="email"
              defaultValue="company@airvinclible.com"
              disabled={loading || !canUpdate}
              className="mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Support Email
            </label>
            <Input
              type="email"
              defaultValue="support@airvincible.com"
              disabled={loading || !canUpdate}
              className="mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <Button disabled={loading || !canUpdate} className="transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">Save Changes</Button>
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
            <input type="checkbox" defaultChecked disabled={loading || !canUpdate} className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Admin Changes</p>
              <p className="text-sm text-slate-600">
                Notify when new admins are added or permissions changed
              </p>
            </div>
            <input type="checkbox" defaultChecked disabled={loading || !canUpdate} className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Employee Updates</p>
              <p className="text-sm text-slate-600">
                Notify for new employee records
              </p>
            </div>
            <input type="checkbox" defaultChecked disabled={loading || !canUpdate} className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed" />
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
            <Button variant="outline" disabled={loading || !canUpdate} className="transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">Enable</Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Change Password</p>
              <p className="text-sm text-slate-600">
                Update your account password
              </p>
            </div>
            <Button variant="outline" disabled={loading || !canUpdate} className="transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">Change</Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Session Timeout</p>
              <p className="text-sm text-slate-600">
                Auto logout after inactivity (in minutes)
              </p>
            </div>
            <Input type="number" defaultValue="30" disabled={loading || !canUpdate} className="w-20 disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      {/* <Card className="border-red-200">
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
            <Button variant="outline" className="transition-all duration-200 hover:shadow-md hover:scale-105">Export</Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="font-medium text-slate-900">Reset All Data</p>
              <p className="text-sm text-slate-600">
                This action cannot be undone
              </p>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700 transition-all duration-200 hover:shadow-md hover:scale-105">
              Reset
            </Button>
          </div>
        </div>
      </Card> */}
    </div>
  );
}
