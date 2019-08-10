using System;

namespace FinishLineApi.Store.Entities
{
    public class Task
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Status { get; set; }
        public int ProjectId { get; set; }
        public Project Project { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}