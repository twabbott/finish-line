using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO.Validators
{
    public class NotFoundException: ContentValidationException
    {
        public NotFoundException(string message) : base(message)
        { }
    }
}
