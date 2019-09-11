using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO
{
    public class ProjectDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Notes { get; set; }
        public string Status { get; set; }
    }
}
