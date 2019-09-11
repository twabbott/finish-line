using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Entities
{
    public class Folder
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int ParentId { get; set; }

        public Folder Parent { get; set; }

        public string Name { get; set; }

        public int Status { get; set; }
    }
}
