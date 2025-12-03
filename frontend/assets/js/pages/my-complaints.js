import { BasePage } from './base-page.js';
import { Table } from '../components/table.js';
import { helpers } from '../utils/helpers.js';

export class MyComplaintsPage extends BasePage {
  async getContent() {
    try {
      const complaints = await this.api.getComplaints();

      const table = new Table({
        columns: [
          { label: 'ID', field: 'id' },
          { label: 'Title', field: 'title' },
          { label: 'Status', field: 'status', format: (val) => helpers.getStatusBadge(val) },
          { label: 'Priority', field: 'priority', format: (val) => helpers.getPriorityBadge(val) },
          { label: 'Created', field: 'created_at', format: (val) => helpers.formatDate(val) }
        ],
        data: complaints,
        actions: [
          {
            name: 'view',
            label: 'View',
            class: 'btn-primary',
            onClick: (row) => this.router.navigate(`/student/complaints/${row.id}`)
          }
        ]
      });

      return `
        <div class="main-content">
          <div class="page-header d-flex justify-between align-center">
            <h1 class="page-title">My Complaints</h1>
            <a href="/student/new-complaint" class="btn btn-primary" data-link>New Complaint</a>
          </div>
          
          <div id="complaintsTable">${table.render()}</div>
        </div>
      `;
    } catch (error) {
      return this.getErrorContent(error.message);
    }
  }

  async afterRender() {
    const container = document.getElementById('complaintsTable');
    const complaints = await this.api.getComplaints();
    const table = new Table({
      columns: [
        { label: 'ID', field: 'id' },
        { label: 'Title', field: 'title' },
        { label: 'Status', field: 'status', format: (val) => helpers.getStatusBadge(val) },
        { label: 'Priority', field: 'priority', format: (val) => helpers.getPriorityBadge(val) },
        { label: 'Created', field: 'created_at', format: (val) => helpers.formatDate(val) }
      ],
      data: complaints,
      actions: [
        {
          name: 'view',
          label: 'View',
          class: 'btn-primary',
          onClick: (row) => this.router.navigate(`/student/complaints/${row.id}`)
        }
      ]
    });
    table.attachEvents(container);
  }
}
