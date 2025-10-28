import React from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const DaisyUITest = () => {
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">DaisyUI Test Page</h1>
          <p className="text-base-content/70 text-lg">Testing DaisyUI components and themes</p>
        </div>

        {/* Buttons */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-accent">Accent</button>
              <button className="btn btn-success">Success</button>
              <button className="btn btn-warning">Warning</button>
              <button className="btn btn-error">Error</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-outline">Outline</button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Alerts</h2>
            <div className="space-y-4">
              <div className="alert alert-success">
                <CheckCircle className="h-6 w-6" />
                <span>Success! DaisyUI is working correctly.</span>
              </div>
              <div className="alert alert-warning">
                <AlertTriangle className="h-6 w-6" />
                <span>Warning: Make sure to test all components.</span>
              </div>
              <div className="alert alert-error">
                <XCircle className="h-6 w-6" />
                <span>Error: This is just a test error message.</span>
              </div>
              <div className="alert alert-info">
                <Info className="h-6 w-6" />
                <span>Info: DaisyUI themes are working properly.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Form Elements</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input type="email" placeholder="Enter your email" className="input input-bordered" />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Message</span>
                </label>
                <textarea className="textarea textarea-bordered" placeholder="Enter your message"></textarea>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Remember me</span>
                  <input type="checkbox" className="checkbox checkbox-primary" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats shadow bg-base-100 w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="stat-title">Total Components</div>
            <div className="stat-value text-primary">50+</div>
            <div className="stat-desc">Available in DaisyUI</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <Info className="h-8 w-8" />
            </div>
            <div className="stat-title">Themes</div>
            <div className="stat-value text-secondary">29</div>
            <div className="stat-desc">Built-in themes</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-accent">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="stat-title">Bundle Size</div>
            <div className="stat-value text-accent">2KB</div>
            <div className="stat-desc">Gzipped CSS</div>
          </div>
        </div>

        {/* Progress & Loading */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Progress & Loading</h2>
            <div className="space-y-4">
              <progress className="progress progress-primary w-full" value="70" max="100"></progress>
              <progress className="progress progress-secondary w-full" value="85" max="100"></progress>
              <div className="flex justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Color Palette</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Accent</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Neutral</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Success</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Warning</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-error rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Error</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-info rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Info</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-base-content/60">
            DaisyUI is successfully installed and configured! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default DaisyUITest;