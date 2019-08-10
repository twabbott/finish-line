using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Store.Repositories
{
    public class NotFoundException: Exception
    {
        public NotFoundException(string message) : base(message)
        { }
    }
}
