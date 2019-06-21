using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Dto
{
    public class LogEntryDto
    {
        public int LogEntryId { get; set; }
        public int ProjectId { get; set; }
        public int WorkItemId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
