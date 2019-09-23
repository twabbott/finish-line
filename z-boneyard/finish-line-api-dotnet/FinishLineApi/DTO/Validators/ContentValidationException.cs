using FluentValidation;
using FluentValidation.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO.Validators
{
    public class ContentValidationException: Exception
    {
        private static string _msg = "Validation failed.";
        private readonly List<string> _errors = new List<string>();

        public ContentValidationException(ValidationResult result) : base(result.Errors.First()?.ErrorMessage ?? _msg)
        {
            result.Errors.ToList().ForEach(error => Errors.Add(error.ErrorMessage));
        }

        public ContentValidationException(string message) : base(message)
        {
            Errors.Add(message);
        }

        public List<string> Errors
        {
            get { return _errors; }
        }
    }
}
