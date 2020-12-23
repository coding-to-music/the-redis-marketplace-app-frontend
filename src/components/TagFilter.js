import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles(() => ({
  categoryHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '5px 0'
  },
  tagsCategory: {
    marginBottom: '15px'
  }
}));

export default function TagFilter({ tags, ...rest }) {
  const classes = useStyles();

  return (
    <div {...rest}>
      {tags.map(({ category, options }) => (
        <FormGroup key={category} className={classes.tagsCategory}>
          <div className={classes.categoryHeader}>{category}</div>
          {options.map((option) => (
            <FormControlLabel
              key={option}
              control={<Checkbox name={option} color="primary" />}
              label={option}
            />
          ))}
        </FormGroup>
      ))}
    </div>
  );
}