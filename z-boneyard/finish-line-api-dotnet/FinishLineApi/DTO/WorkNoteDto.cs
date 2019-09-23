using System;

namespace FinishLineApi.Dto
{
    public class WorkNoteDto
    {
        public int Id { get; set; }
        public int? ProjectId { get; set; }
        public int? WorkItemId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
