using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO.Validators
{
    internal static class Validation<ValidatorType, DtoType>
        where ValidatorType : AbstractValidator<DtoType>, new()
    {
        public static void ValidateObject(DtoType item, string category)
            
        {
            ValidatorType validator = new ValidatorType();
            var results = validator.Validate(item, category);
            if (!results.IsValid)
            {
                throw new ContentValidationException(results);
            }
        }
    }
}
