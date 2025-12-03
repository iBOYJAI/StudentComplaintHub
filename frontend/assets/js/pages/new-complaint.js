import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class NewComplaintPage extends BasePage {
  async getContent() {
    try {
      const categories = await this.api.getCategories();
      const locations = await this.api.getLocations();

      return `
        <div class="main-content">
          <div class="complaint-form-container">
            <h1 class="page-title">Submit New Complaint</h1>
            
            <form id="complaintForm">
              <div class="form-section">
                <h3 class="form-section-title">Complaint Details</h3>
                
                <div class="form-group">
                  <label class="form-label required">Title</label>
                  <input type="text" class="form-control" name="title" required placeholder="Brief description of the issue">
                  <div class="invalid-feedback"></div>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Description</label>
                  <textarea class="form-control" name="description" rows="5" required placeholder="Provide detailed information about your complaint"></textarea>
                  <div class="invalid-feedback"></div>
                </div>
                
                <div class="d-grid grid-cols-2 gap-4">
                  <div class="form-group">
                    <label class="form-label required">Category</label>
                    <select class="form-control" name="category_id" required>
                      <option value="">Select Category</option>
                      ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label required">Location</label>
                    <select class="form-control" name="location_id" required>
                      <option value="">Select Location</option>
                      ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Priority</label>
                  <select class="form-control" name="priority" required>
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" name="anonymous" value="1">
                  <label class="form-check-label">Submit Anonymously</label>
                </div>
              </div>
              
              <div class="d-flex gap-3 justify-end mt-8">
                <a href="/student/dashboard" class="btn btn-secondary" data-link>Cancel</a>
                <button type="submit" class="btn btn-primary">Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      `;
    } catch (error) {
      return this.getErrorContent(error.message);
    }
  }

  async afterRender() {
    const form = document.getElementById('complaintForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(new FormData(form));
    });
  }

  async handleSubmit(formData) {
    try {
      const data = Object.fromEntries(formData);
      const complaint = await this.api.createComplaint(data);
      Toast.success('Complaint submitted successfully!');
      this.router.navigate(`/student/complaints/${complaint.id}`);
    } catch (error) {
      Toast.error(error.message || 'Failed to submit complaint');
    }
  }
}
